import { useState } from "react";
import { AuthModal } from "../components/Auth/AuthModal";
import { UserProfile } from "../components/Auth/UserProfile";
import { useAuth } from "../contexts/AuthContext";

export function HomePage2() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user } = useAuth();

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div
      style={{
        fontFamily: "Cormorant Garamond",
        height: "100vh",
        backgroundColor: "#95CFFF",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid #4A0707",
          height: "fit-content",
          width: "fit-content",
          transformOrigin: "50% 50%",
          transform: "scale(0.8)",
        }}
      >
        <div
          style={{
            width: "661px",
            height: "640px",
            backgroundImage: "url(/images/gialaitronglanh.webp)",
          }}
        >
          <div
            style={{
              marginLeft: -285,
              marginBottom: 48,
            }}
          >
            <i>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 96,
                  textWrap: "nowrap",
                }}
              >
                <span>Gia Lai&nbsp;</span>
                <span
                  style={{
                    color: "white",
                  }}
                >
                  &nbsp;trong lành
                </span>
              </span>
            </i>
          </div>
          <div>
            <a
              className="cursor-pointer hover:decoration-underline"
              href="/activities"
            >
              <i>
                <span
                  style={{
                    marginLeft: -266,
                    fontWeight: 500,
                    fontSize: 48,
                    textWrap: "nowrap",
                  }}
                >
                  <span>Các hành động&nbsp;</span>
                  <span
                    style={{
                      color: "white",
                    }}
                  >
                    &nbsp;bảo vệ môi trường
                  </span>
                </span>
              </i>
            </a>
          </div>
          <div>
            <i>
              <span
                style={{
                  marginLeft: -177,
                  fontWeight: 500,
                  fontSize: 48,
                  textWrap: "nowrap",
                }}
              >
                <span>Du ngoạn&nbsp;</span>
                <span
                  style={{
                    color: "white",
                  }}
                >
                  &nbsp;thiên nhiên và làng nghề
                </span>
              </span>
            </i>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              marginRight: 20,
              fontWeight: 500,
              fontSize: 36,
              textWrap: "nowrap",
              color: "white",
            }}
          >
            {user ? (
              <UserProfile />
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="hover:underline cursor-pointer mb-2"
                  style={{ fontSize: 36 }}
                >
                  đăng nhập
                </button>
                <button
                  onClick={handleSignupClick}
                  className="hover:underline cursor-pointer"
                  style={{ fontSize: 36 }}
                >
                  đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}
